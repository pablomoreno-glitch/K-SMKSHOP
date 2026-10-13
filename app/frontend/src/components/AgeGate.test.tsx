import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AgeGate } from "./AgeGate";
import { isAgeConfirmed } from "../lib/ageGate";

const renderAt = (path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AgeGate />
    </MemoryRouter>,
  );

describe("AgeGate", () => {
  beforeEach(() => localStorage.clear());

  it("blocks the store until the visitor confirms", () => {
    renderAt();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /tengo 18\+/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(isAgeConfirmed()).toBe(true);
  });

  it("keeps minors out", () => {
    renderAt();
    fireEvent.click(screen.getByRole("button", { name: /soy menor/i }));
    expect(screen.getByRole("heading", { name: /solo para adultos/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tengo 18\+/i })).not.toBeInTheDocument();
    expect(isAgeConfirmed()).toBe(false);
  });

  it("lets anyone read the cookie policy", () => {
    renderAt("/cookies");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
