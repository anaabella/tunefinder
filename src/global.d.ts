
declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}

declare module 'node-fetch' {
    const fetch: typeof import('undici').fetch;
    export default fetch;
}
