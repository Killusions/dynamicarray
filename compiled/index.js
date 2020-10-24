"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicArray = void 0;
function makeIterator(array) {
    let index = 0;
    return {
        [Symbol.iterator]() {
            return {
                next: function () {
                    const value = array[index];
                    index++;
                    return { value: value, done: value ? false : true };
                }
            };
        }
    };
}
function iterate(array, exec, doReturnValues, stopOnValue, notStoppedReturnValue) {
    let index = 0;
    const execArray = array.slice();
    const returnMap = [...Array(execArray.length).keys()];
    let length = execArray.length;
    let allowExecution = true;
    const oldPush = array.push;
    array.push = (...items) => {
        if (allowExecution) {
            returnMap.push(...[...Array(items.length).keys()].map(key => key + execArray.length));
            execArray.push(...items);
            length += items.length;
        }
        return length;
    };
    const oldSplice = array.splice;
    array.splice = (start, deleteCount, ...items) => {
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
    array.slice = (start, end) => {
        return returnMap.slice(start, end).map(index => execArray[index]);
    };
    const returnList = [];
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
exports.DynamicArray = {
    forEach(array, exec) {
        iterate(array, exec, false);
    },
    map(array, exec) {
        return iterate(array, exec, true);
    },
    filter(array, exec) {
        return iterate(array, exec, true).filter((item) => item);
    },
    some(array, exec) {
        return iterate(array, exec, false, true);
    },
    every(array, exec) {
        return iterate(array, exec, false, false);
    }
};
