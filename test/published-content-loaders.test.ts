import assert from "node:assert/strict";
import test from "node:test";
import {
  loadPublishedHomeModulesStrictWithRequest,
  loadPublishedToursStrictWithRequest,
} from "../src/lib/published-content-loaders.ts";

test("strict published home content loading propagates failures without logging", async () => {
  const failure = new Error("Home content unavailable");
  const originalConsoleError = console.error;
  let logs = 0;
  console.error = () => { logs += 1; };
  try {
    await assert.rejects(
      () => loadPublishedHomeModulesStrictWithRequest(async () => {
        throw failure;
      }),
      (error: Error) => {
        assert.equal(error.message, "Unable to load published homepage content");
        assert.equal(error.cause, failure);
        assert.doesNotMatch(error.message, /Home content unavailable/);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(logs, 0);
});

test("strict published tour loading propagates failures without logging", async () => {
  const failure = new Error("Tours unavailable");
  const originalConsoleError = console.error;
  let logs = 0;
  console.error = () => { logs += 1; };
  try {
    await assert.rejects(
      () => loadPublishedToursStrictWithRequest(async () => {
        throw failure;
      }),
      (error: Error) => {
        assert.equal(error.message, "Unable to load published tours");
        assert.equal(error.cause, failure);
        assert.doesNotMatch(error.message, /Tours unavailable/);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(logs, 0);
});
