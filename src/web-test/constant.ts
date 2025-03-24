import { OfficialExampleInfo } from '@/official';

export const exampleLoaders = Object.fromEntries(
  Object.entries(import.meta.glob('../official/examples/[^$]*.js'))
    .map(([key, value]) => {
      return [key.slice(key.lastIndexOf('/') + 1, -3), value] as [
        string,
        () => Promise<{ default: OfficialExampleInfo }>
      ];
    })
    .sort((a, b) => a[0].localeCompare(b[0]))
);
