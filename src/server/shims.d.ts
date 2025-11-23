declare module 'express';
declare module 'cors';
declare module 'socket.io';
declare module 'http';

declare namespace NodeJS {
  type Timeout = number;
}

declare const process: {
  env: Record<string, string | undefined>;
};
