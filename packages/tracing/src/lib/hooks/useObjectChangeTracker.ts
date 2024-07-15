import { useCallback, useRef } from "react";
import { areHookInputsEqual } from "../functions";
import type { IObjectChangeTracker } from "../interfaces";

export function useObjectChangeTracker(
  scopeName: string,
  objectType: string
): IObjectChangeTracker {
  const prevObj = useRef<object>();

  const compare = useCallback(
    (scopeObject?: object): void => {
      // console.log(`[useObjectChangeTracker]${scopeName} ${objectType}`, scopeObject);
      if (undefined === scopeObject) {
        return;
      }

      let prevArr: unknown[] = [];
      if (prevObj.current) {
        prevArr = Object.values(prevObj.current);
      }
      const currentArr = Object.values(scopeObject);

      const result = areHookInputsEqual(currentArr, prevArr);
      if (!result.equal) {
        // For troubleshooting this component: console.log(`[useObjectChangeTracker]${scopeName} ${objectType}`, result);
        if (1 === result.diffIndex.length && -1 === result.diffIndex[0]) {
          if (0 === prevArr.length) {
            console.log(`[${scopeName}] Initial render`);
            const names = Object.keys(scopeObject);
            for (let index = 0; index < names.length; index++) {
              console.info(
                `[${scopeName}] Initial ${objectType}: ${names[index]} =`,
                currentArr[index]
              );
            }
          } else {
            console.log(
              `[${scopeName}] The current object has a different number of items compared to last render. (Usually unexpected.)`
            );
            console.info(
              `[${scopeName}] Previous ${objectType}: `,
              prevObj.current
            );
            console.info(`[${scopeName}] Current ${objectType}: `, scopeObject);
          }
        } else {
          // console.log("The object has changed since last render");
          const names = Object.keys(scopeObject);
          result.diffIndex.forEach((index) => {
            console.info(
              `[${scopeName}] Previous ${objectType}: ${names[index]} =`,
              prevArr[index]
            );
            console.info(
              `[${scopeName}] Current ${objectType}: ${names[index]} =`,
              currentArr[index]
            );
          });
        }
      }

      prevObj.current = scopeObject;
    },
    [objectType, scopeName]
  );

  return { compare };
}
