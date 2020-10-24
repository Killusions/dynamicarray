function makeIterator(array: any[]) {
  let index = 0;
  return {
    [Symbol.iterator]() {
      return {
        next: function() {
          const done = array.length - 1 < index;
          const value = done ? undefined : array[index];
          index++;
          return { value: value, done };
        }
      };
    }
  };
}

function iterate(array: any[], exec: (x?: any, i?: number, a?: any[]) => any, doReturnValues: boolean, stopOnValue?: any, notStoppedReturnValue?: any): any {
  let index = 0;
  const execArray = array.slice();
  const returnMap = [...Array(execArray.length).keys()];
  let length = execArray.length;
  let allowExecution = true;
  const oldPush = array.push;
  array.push = (...items: any[]): number => {
    if (allowExecution) {
      returnMap.push(...[...Array(items.length).keys()].map(key => key + execArray.length));
      execArray.push(...items);
      length += items.length;
    }
    return length;
  };
  const oldSplice = array.splice;
  array.splice = (start: number, deleteCount: number, ...items: any[]): any[] => {
    let spliceReturn = [];
    if (allowExecution) {
      spliceReturn = returnMap.slice(start, start + deleteCount).map(index => execArray[index]);
      returnMap.splice(start, deleteCount, ...[...Array(items.length).keys()].map(key => key + execArray.length));
      execArray.push(...items);
      length -= spliceReturn.length;
      length += items.length;
    }
    return spliceReturn;
  };
  const oldSlice = array.slice;
  array.slice = (start?: number, end?: number): any[] => {
    return returnMap.slice(start, end).map(index => execArray[index]);
  };
  const returnList: any[] = [];
  for (const element of makeIterator(execArray)) {
    if (allowExecution) {
      const returnValue = exec(element, index);
      if (stopOnValue !== undefined && returnValue === stopOnValue) {
        allowExecution = false;
      }
      if (doReturnValues) {
        returnList.push(returnValue);
      }
      index++;
    }
  }
  array.push = oldPush;
  array.splice = oldSplice;
  array.slice = oldSlice;
  return stopOnValue !== undefined ? allowExecution ? notStoppedReturnValue : stopOnValue : doReturnValues ? returnMap.map(index => returnList[index]) : [];
}

export const DynamicArray = {
  forEach(array: any[], exec: (x?: any, i?: number, a?: any[]) => any): void {
    if (array.length > 0) {
      iterate(array, exec, false);
    }
  },
  map(array: any[], exec: (x?: any, i?: number, a?: any[]) => any): any[] {
    return array.length > 0 ? iterate(array, exec, true) : [];
  },
  filter(array: any[], exec: (x?: any, i?: number, a?: any[]) => boolean): any[] {
    return array.length > 0 ? iterate(array, exec, true).filter((item: any) => item) : [];
  },
  some(array: any[], exec: (x?: any, i?: number, a?: any[]) => boolean): boolean {
    return array.length > 0 ? iterate(array, exec, false, true) : false;
  },
  every(array: any[], exec: (x?: any, i?: number, a?: any[]) => boolean): boolean {
    return array.length > 0 ? iterate(array, exec, false, false) : true;
  }
};
