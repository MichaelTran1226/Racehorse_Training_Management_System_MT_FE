export interface Hero {
  eyebrow: string;
  lines: [string, string];
  body: string;
}

export const HERO_DEFAULT: Hero = {
  eyebrow: "EQUIFLOW · ONE WORKSPACE, FIVE ROLES",
  lines: ["Every horse.", "One journey forward."],
  body: "Track form, schedule training and stay beside every horse in the club.",
};

export const HERO_TEAM: Hero = {
  eyebrow: "EQUIFLOW · ONE WORKSPACE, FIVE ROLES",
  lines: ["One team.", "One shared goal."],
  body: "Every account is tied to one role, and every role sees only the work it is granted.",
};
