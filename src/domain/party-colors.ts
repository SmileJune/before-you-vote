export type PartyColor = {
  background: string;
  border: string;
  text: string;
};

const NEUTRAL_PARTY_COLOR: PartyColor = {
  background: "#F3F4F6",
  border: "#CBD5E1",
  text: "#334155"
};

const PARTY_COLORS: Record<string, PartyColor> = {
  더불어민주당: color("#004EA2"),
  국민의힘: color("#E61E2B"),
  조국혁신당: color("#0073CF"),
  개혁신당: color("#FF7210"),
  진보당: color("#D6001C"),
  정의당: color("#FFCC00", "#3A3000"),
  기본소득당: color("#00A887"),
  사회민주당: color("#F58220", "#3A2200"),
  녹색당: color("#5CB531"),
  노동당: color("#E60012"),
  여성의당: color("#6A1B9A"),
  새미래민주당: color("#45B7E8"),
  자유통일당: color("#C9151E"),
  자유민주당: color("#0E4EA2"),
  한나라당: color("#0095DA"),
  무소속: NEUTRAL_PARTY_COLOR
};

export function getPartyColor(partyName: string): PartyColor {
  return PARTY_COLORS[partyName] ?? NEUTRAL_PARTY_COLOR;
}

function color(hex: string, text = hex): PartyColor {
  return {
    background: withAlpha(hex, 0.12),
    border: withAlpha(hex, 0.55),
    text
  };
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
