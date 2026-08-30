import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidIndonesianPhone, normalizeIndonesianPhone } from "./phone";

describe("Nomor HP Indonesia (PRD Bab F13)", () => {
  it("menerima 08xx dan menormalisasi ke 62xx", () => {
    assert.equal(normalizeIndonesianPhone("081234567890"), "6281234567890");
    assert.equal(normalizeIndonesianPhone("0812 3456 7890"), "6281234567890");
    assert.equal(normalizeIndonesianPhone("0812-345-67890"), "6281234567890");
    assert.equal(normalizeIndonesianPhone("(0812) 3456 7890"), "6281234567890");
  });

  it("menerima +62 / 62 dan menormalisasi tanpa tanda +", () => {
    assert.equal(normalizeIndonesianPhone("+6281234567890"), "6281234567890");
    assert.equal(normalizeIndonesianPhone("+62 812-3456-7890"), "6281234567890");
    assert.equal(normalizeIndonesianPhone("62812 3456 7890"), "6281234567890");
  });

  it("konsisten: 08 dan +62 dari nomor sama menghasilkan bentuk kanonik sama", () => {
    const a = normalizeIndonesianPhone("081234567890");
    const b = normalizeIndonesianPhone("+62 8123 4567 890");
    assert.equal(a, b);
  });

  it("batas panjang: 08 + 8 digit (min) dan 08 + 11 digit (max) valid", () => {
    assert.equal(normalizeIndonesianPhone("0812345678"), "62812345678");
    assert.equal(normalizeIndonesianPhone("0812345678901"), "62812345678901");
  });

  it("menolak prefix yang salah dan panjang di luar rentang", () => {
    assert.equal(normalizeIndonesianPhone("071234567890"), null);
    assert.equal(normalizeIndonesianPhone("08123456789012"), null);
    assert.equal(normalizeIndonesianPhone("08123456"), null);
  });

  it("menolak input kosong / bukan nomor", () => {
    assert.equal(normalizeIndonesianPhone(""), null);
    assert.equal(normalizeIndonesianPhone("12345"), null);
    assert.equal(normalizeIndonesianPhone("budi123"), null);
    assert.equal(normalizeIndonesianPhone("0812 34 56"), null);
  });

  it("isValidIndonesianPhone selaras dengan normalize", () => {
    assert.equal(isValidIndonesianPhone("081234567890"), true);
    assert.equal(isValidIndonesianPhone("0812 345"), false);
  });
});
