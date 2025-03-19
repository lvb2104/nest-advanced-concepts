// represents a communication channel between the main thread and worker threads
// import { parentPort } from 'worker_threads';

function fib(n: number): number {
  if (n < 2) {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}

// event listener for messages from the main thread
// id is a unique identifier for the task
// parentPort?.on('message', ({ n, id }: { n: number; id: string }) => {
//   const result = fib(n);
// send the result back to the main thread after computation
//   parentPort?.postMessage({ result, id });
// });

module.exports = (n: number) => {
  return fib(n);
};
