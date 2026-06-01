import {
  completePromise,
  ScriptFunction,
  stringToFileBuffer,
} from '@code-recycle/cli';
import { platform } from 'os';

const fn: ScriptFunction = async (util, rule, host, injector) => {
  let filePath = util.path.join(util.filePathGroup.root, 'product.json');
  let content: string = (await util.host.readContent(filePath))!;
  let data1 = JSON.parse(content);
  data1['win32DirName'] = 'ShengHuaBi';
  data1['win32NameVersion'] = 'ShengHuaBi';
  data1['win32RegValueName'] = 'ShengHuaBi';
  data1['nameShort'] = 'ShengHuaBi';
  data1['nameLong'] = 'ShengHuaBi';
  data1['applicationName'] = 'ShengHuaBi';
  data1['dataFolderName'] = '.ShengHuaBi';
  data1['win32MutexName'] = 'ShengHuaBi';
  data1['linuxIconName'] = 'ShengHuaBi';
  data1['win32AppUserModelId'] = 'Chen.ShengHuaBi';
  data1['win32ShellNameShort'] = 'S&hengHuaBi';
  data1['builtInExtensions'] = buildInExtensionList;
  data1['extensionsGallery'] = {
    serviceUrl: 'https://marketplace.visualstudio.com/_apis/public/gallery',
    itemUrl: 'https://marketplace.visualstudio.com/items',
    cacheUrl: 'https://vscode.blob.core.windows.net/gallery/index',
    controlUrl: '',
  };
  data1['quality'] = 'exploration';
  delete data1['serverLicenseUrl'];
  delete data1['licenseUrl'];
  // data1['licenseName']="";
  delete data1['reportIssueUrl'];
  let data = JSON.stringify(data1, undefined, 4);
  await completePromise(util.host.write(filePath, stringToFileBuffer(data)));
  await host.writeToFs();
  console.log('product.json更新完成');
};
export default fn;

let buildInExtensionList = [
  // https://marketplace.visualstudio.com/items?itemName=MS-CEINTL.vscode-language-pack-zh-hans
  // https://marketplace.visualstudio.com/_apis/public/gallery/publishers/ms-ceintl/vsextensions/vscode-language-pack-zh-hans/1.98.2025022817/vspackage?targetPlatform=win32-x64
  // 下载后查找sha256 https://marketplace.visualstudio.com/_apis/public/gallery/publishers/MS-CEINTL/vsextensions/vscode-language-pack-zh-hans/1.121.2026052214/vspackage
  {
    name: 'MS-CEINTL.vscode-language-pack-zh-hans',
    version: '1.121.2026052214',
    sha256: '890bcaea3b25f16feedcd2c5155e48e990dc4df1689193ed712f5342eb34abf6',
    repo: 'https://github.com/microsoft/vscode-loc',
    metadata: {
      id: 'e4ee7751-6514-4731-9cdb-7580ffa9e70b',
      publisherId: {
        publisherId: '0b0882c3-aee3-4d7c-b5f9-872f9be0a115',
        publisherName: 'MS-CEINTL',
        displayName: 'Microsoft',
        flags: 'verified',
      },
      publisherDisplayName: 'Microsoft',
    },
  },
  // 下载后查找sha256 https://marketplace.visualstudio.com/_apis/public/gallery/publishers/smcpeak/vsextensions/default-keys-windows/1.0.0/vspackage

  platform() === 'linux'
    ? {
        name: 'smcpeak.default-keys-windows',
        version: '1.0.0',
        sha256:
          '6d2ec79ced9abd7912c179ae674a1ed928ffab76182ce57895d6806a4f70f516',
        repo: 'https://github.com/microsoft/vscode-loc',
        metadata: {
          id: '93f9de62-940d-4f24-aebd-5f3e532fec09',
          publisherId: {
            publisherId: '474c9e0e-1ebb-4459-8aee-c1b95e7eb3a9',
            publisherName: 'smcpeak',
            displayName: 'smcpeak',
            flags: 'verified',
          },
          publisherDisplayName: 'smcpeak',
        },
      }
    : undefined,
  // 下载后查找sha256 https://marketplace.visualstudio.com/_apis/public/gallery/publishers/redhat/vsextensions/vscode-yaml/1.23.0/vspackage
  {
    name: 'redhat.vscode-yaml',
    version: '1.23.0',
    sha256: '182ec0210214c3e179ac1b1c4defae94ab7ff7bb3ba7adfa4cb46f99c4fd6fd7',
    metadata: {
      id: '2061917f-f76a-458a-8da9-f162de22b97e',
      publisherId: {
        publisherId: 'eed56242-9699-4317-8bc7-e9f4b9bdd3ff',
        publisherName: 'redhat',
        displayName: 'Red Hat',
        flags: 'verified',
      },
      publisherDisplayName: 'redhat',
    },
  },
  {
    name: 'ms-vscode.js-debug-companion',
    version: '1.1.3',
    sha256: '7380a890787452f14b2db7835dfa94de538caf358ebc263f9d46dd68ac52de93',
    repo: 'https://github.com/microsoft/vscode-js-debug-companion',
    metadata: {
      id: '99cb0b7f-7354-4278-b8da-6cc79972169d',
      publisherId: {
        publisherId: '5f5636e7-69ed-4afe-b5d6-8d231fb3d3ee',
        publisherName: 'ms-vscode',
        displayName: 'Microsoft',
        flags: 'verified',
      },
      publisherDisplayName: 'Microsoft',
    },
  },
  {
    name: 'ms-vscode.js-debug',
    version: '1.117.0',
    sha256: '854eeb8a785b1f41ba2bd02d7ccd4fdbe10021b61473293973c7e96d036c7fb8',
    repo: 'https://github.com/microsoft/vscode-js-debug',
    metadata: {
      id: '25629058-ddac-4e17-abba-74678e126c5d',
      publisherId: {
        publisherId: '5f5636e7-69ed-4afe-b5d6-8d231fb3d3ee',
        publisherName: 'ms-vscode',
        displayName: 'Microsoft',
        flags: 'verified',
      },
      publisherDisplayName: 'Microsoft',
    },
  },
  {
    name: 'ms-vscode.vscode-js-profile-table',
    version: '1.0.10',
    sha256: '7361748ddf9fd09d8a2ed1f2a2d7376a2cf9aae708692820b799708385c38e08',
    repo: 'https://github.com/microsoft/vscode-js-profile-visualizer',
    metadata: {
      id: '7e52b41b-71ad-457b-ab7e-0620f1fc4feb',
      publisherId: {
        publisherId: '5f5636e7-69ed-4afe-b5d6-8d231fb3d3ee',
        publisherName: 'ms-vscode',
        displayName: 'Microsoft',
        flags: 'verified',
      },
      publisherDisplayName: 'Microsoft',
    },
  },
  // 同台添加
  // {
  //   name: 'wszgrcy.tts',
  //   version: '1.0.1',
  //   sha256: 'c10af75759130c745cadab5e8812d90350df52157fab8c083e6f8e96878c6e5f',
  //   repo: 'https://github.com/wszgrcy/shb-ext-tts',
  //   vsix: './extension-dist/tts-1.0.1.vsix',
  //   metadata: {
  //     id: 'fe76ab2c-6786-4de4-8db3-9ba84b5a3d89',
  //     publisherId: {
  //       publisherId: 'fe76ab2c-6786-4de4-8db3-9ba84b5a3d89',
  //       publisherName: 'wszgrcy',
  //       displayName: 'wszgrcy',
  //       flags: 'verified',
  //     },
  //     publisherDisplayName: 'wszgrcy',
  //   },
  // },
].filter(Boolean);
