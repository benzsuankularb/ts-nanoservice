/* eslint-disable @typescript-eslint/no-explicit-any */
export const JSONUtils = {
  sortKeys: (obj: any) => {
    return Object.keys(obj)
      .sort()
      .reduce((_result, key) => {
        _result[key] = obj[key];
        return _result;
      }, {} as any);
  },
  hashString: (obj: any) => {
    if (typeof obj === 'object') {
      return JSONUtils.sortKeys(obj);
    }
    return JSON.stringify(obj);
  },
};
