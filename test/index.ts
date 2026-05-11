import * as path from 'path';
import Mocha from 'mocha';
import fg from 'fast-glob';
// dts不对,所以先暂时不用,等哪天cli不行了再用这个.参考`@vscode/test-cli` 可能和nyc一样
// import { Report } from "c8";
// function coverageSupport(){
//   const nyc = new Report({
//     excludeAfterRemap:true,
//     // cwd: path.join(__dirname, '../../'),
//     extension: ['.ts', '.js'],
//     exclude: ['node_modules'],
//     // include: [],
//     all: false,
//     // instrument: true,
//     // hookRequire: true,
//     // hookRunInContext: true,
//     // hookRunInThisContext: true,
//     reporter: ['html'],
//     // reportDir: 'coverage',
    
//   });
//   nyc.run()
// }
export function run(): Promise<void> {
  const mocha = new Mocha({
    // ui: 'tdd',
    timeout: 20_000,
  });

  const testsRoot = path.resolve(__dirname);

  return new Promise(async (c, e) => {
    let files = await fg('**/**.spec.js', { cwd: testsRoot });
    files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

    try {
      mocha.run((failures) => {
        if (failures > 0) {
          e(new Error(`${failures} tests failed.`));
        } else {
          c();
        }
      });
    } catch (err) {
      console.error(err);
      e(err);
    }
  });
}
