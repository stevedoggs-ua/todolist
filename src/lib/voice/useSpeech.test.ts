import { describe, it, expect } from "vitest";
import { isSpeechSupported } from "./useSpeech";

describe("isSpeechSupported", () => {
  it("returns false when no SpeechRecognition on window", () => {
    expect(isSpeechSupported({} as any)).toBe(false);
  });
  it("returns true when webkitSpeechRecognition exists", () => {
    expect(isSpeechSupported({ webkitSpeechRecognition: function () {} } as any)).toBe(true);
  });
});
