export type Role = "learner" | "native";
export type LearnerStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type MissionItem = {
  emoji: string;
  label: string;
  quantity: number;
};

export type MissionConfig = {
  id: string;
  place: string;
  level: string;
  duration: string;
  title: string;
  context: string;
  budget: number;
  unknownPricesText: string;
  items: MissionItem[];
};
