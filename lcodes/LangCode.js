import { CSV } from "https://js.sabae.cc/CSV.js";

class LangCode {
  static fn = "./lcodes/ISO639.csv";
  static csv = null;
  static async init() {
    if (LangCode.csv) {
      return LangCode.csv;
    }
    const csv = await CSV.fetch(LangCode.fn);
    LangCode.csv = csv;
    return csv;
  }
  static async encode(s) {
    const csv = await LangCode.init();
    // const value = csv.find(line => line[1].indexOf(s) >= 0);
	const value = csv.find(line => line[1].split("; ").includes(s));
    if (!value) {
      return null;
    }
    return value[0];
  }
}

export { LangCode };
