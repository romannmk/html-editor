export function timeout(milliseconds: number = 0) {
  return ({}, {}, descriptor: any) => {
    const originalMethod = descriptor.value

    descriptor.value = function(...args: any) {
      setTimeout(() => {
        originalMethod.apply(this, args)
      }, milliseconds)
    }

    return descriptor
  }
}

// tslint:disable-next-line: ban-types
export function bind<T extends Function>(
  // tslint:disable-next-line: variable-name
  _target: object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>,
): TypedPropertyDescriptor<T> | void {
  if (!descriptor || typeof descriptor.value !== 'function') {
    throw new TypeError(
      `Only methods can be decorated with @bind. <${propertyKey}> is not a method!`,
    )
  }

  return {
    configurable: true,
    get(this: T): T {
      const bound: T = descriptor.value!.bind(this)
      Object.defineProperty(this, propertyKey, {
        value: bound,
        // tslint:disable-next-line: object-literal-sort-keys
        configurable: true,
        writable: true,
      })
      return bound
    },
  }
}
