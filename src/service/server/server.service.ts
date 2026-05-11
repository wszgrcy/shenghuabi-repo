import { inject, Injector, RootStaticInjectOptions } from 'static-injector';
import { ExtensionConfig } from '../config.service';
import Fastify from 'fastify';
import { WorkflowExecService } from '@shenghuabi/workflow';
import { WorkflowSelectService } from '@shenghuabi/workflow';
import cors from '@fastify/cors';
import { toJsonSchema } from '@valibot/to-json-schema';
import * as v from 'valibot';
import { FastifySSEPlugin } from 'fastify-sse-v2';
import { createAsyncGeneratorAdapter } from '../../share/util/generator-adapter';

const ExecInputDefine = v.object({
  name: v.string(),
  inputs: v.optional(v.record(v.string(), v.any())),
  environmentParameters: v.optional(v.record(v.string(), v.any())),
});
type ExecInputType = v.InferOutput<typeof ExecInputDefine>;
export class ServerService extends RootStaticInjectOptions {
  #injector = inject(Injector);
  init() {
    if (ExtensionConfig.server.enable()) {
      this.#listen();
    }
  }
  async #listen() {
    const fastify = Fastify({
      logger: true,
    });
    await fastify.register(cors, {
      // put your options here
    });
    fastify.register(FastifySSEPlugin);

    fastify.post(
      '/workflow/stream',
      {
        schema: {
          body: toJsonSchema(ExecInputDefine),
        },
      },
      async (req, reply) => {
        const body = req.body as ExecInputType;
        const ab = new AbortController();
        req.raw.on('close', () => {
          if (req.raw.aborted) {
            ab.abort();
          }
        });
        const ag = await this.#runWorkflow(body, {
          isStream: true,
          signal: ab.signal,
        });
        reply.sse(ag);
      },
    );
    fastify.post(
      '/workflow/exec',
      {
        schema: {
          body: toJsonSchema(ExecInputDefine),
        },
      },
      async (req, reply) => {
        const body = req.body as ExecInputType;
        reply.headers({
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        const ab = new AbortController();
        req.raw.on('close', () => {
          if (req.raw.aborted) {
            ab.abort();
          }
        });
        return this.#runWorkflow(body, { isStream: false, signal: ab.signal });
      },
    );
    fastify.post(
      '/workflow/inputs',
      {
        schema: {
          body: toJsonSchema(
            v.object({
              name: ExecInputDefine.entries.name,
            }),
          ),
        },
      },
      async (req, reply) => {
        const body = req.body as ExecInputType;
        reply.headers({
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });

        const workflow = this.#injector.get(WorkflowSelectService);
        const workflowExec = this.#injector.get(WorkflowExecService);
        const result = await workflow.get({ workflowName: body.name });
        return { inputs: workflowExec.parse(result).data!.inputList };
      },
    );
    fastify.listen({
      port: ExtensionConfig.server.port(),
      host: ExtensionConfig.server.host(),
    });
  }

  async #runWorkflow<T extends boolean>(
    body: ExecInputType,
    options: {
      isStream: T;
      signal: AbortSignal;
    },
  ): Promise<
    T extends true
      ? AsyncGenerator<{ id: string; data: string }, void, unknown>
      : { value: any; extra?: any }
  > {
    const workflow = this.#injector.get(WorkflowSelectService);
    const workflowExec = this.#injector.get(WorkflowExecService);
    const fileName = body.name;
    const result = await workflow.get({ workflowName: fileName });
    const aga = createAsyncGeneratorAdapter<{ id: string; data: string }>();
    let index = 0;
    const instance = workflowExec
      .exec(
        result,
        {
          input: body.inputs,
          environmentParameters: body.environmentParameters,
        },
        { showError: true },
        {
          next(value) {
            aga.next({ id: `${index++}`, data: JSON.stringify(value) });
          },
          error(err) {},
          complete() {},
        },
        options.signal,
      )

      .finally(() => {
        aga.complete();
      });
    if (options.isStream) {
      return aga.getData() as any;
    } else {
      return instance as any;
    }
  }
}
