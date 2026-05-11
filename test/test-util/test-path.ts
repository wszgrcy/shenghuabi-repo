import { path } from '@cyia/vfs2';

export function getWorkSpaceDir() {
  return path.join(TEST_CWD, './test/fixture/workspace');
}
export function getSoftWareDir() {
  return path.join(TEST_CWD, './test/fixture/test-software');
}
export function getDefaultDir() {
  return path.join(TEST_CWD, './test/fixture/test-defaultdir');
}
export function getFixture() {
  return path.join(TEST_CWD, './test/fixture');
}
export function getDictDir() {
  return path.join(TEST_CWD, './test/fixture/dict');
}
