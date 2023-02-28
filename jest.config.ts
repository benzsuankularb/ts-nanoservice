import type { Config } from "@jest/types";
import { config } from 'dotenv';
config({ path: './.simulator/pubsub/.env'});

export default async (): Promise<Config.InitialOptions> => {
  return {
    preset: "ts-jest",
     displayName: {
     name: "placeNameOfYourAppHere",
     color: "greenBright",
   },
   verbose: false,
//    setupFiles: ["dotenv/config"],
   testMatch: ["**/**/*.test.ts"],
   testEnvironment: "node",
   detectOpenHandles: true,
   collectCoverage: true,
   transform: { "^.+\\.tsx?$": "ts-jest" },
//    globalTeardown: "<rootDir>/src/tests/jest-globals-teardown.ts",
   forceExit: true,
 };
};