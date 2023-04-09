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
   testMatch: ["**/**/*.test.ts"],
   testEnvironment: "node",
   detectOpenHandles: true,
   collectCoverage: false,
   transform: { "^.+\\.tsx?$": "ts-jest" },
   forceExit: true,
 };
};