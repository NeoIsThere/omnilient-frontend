import type { Topic } from "@omnilient/contracts";

const outlinePrefix = /^(?:\d+(?:\.\d+)+\.?|\d+\.)\s+/;
const partPrefix = /^Part\s+[IVXLCDM]+\s*[—-]\s*/i;
const isPart = (topic: Topic) => topic.isPart || partPrefix.test(topic.name);

function roman(value: number): string {
  const digits: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  for (const [size, digit] of digits) {
    while (value >= size) {
      result += digit;
      value -= size;
    }
  }
  return result;
}

export function numberTopics(topics: Topic[]): Map<string, string> {
  const known = new Set(topics.map((topic) => topic.id));
  const children = new Map<string | null, Topic[]>();
  for (const topic of topics) {
    const parent = topic.parentId && known.has(topic.parentId) ? topic.parentId : null;
    const siblings = children.get(parent) || [];
    siblings.push(topic);
    children.set(parent, siblings);
  }
  for (const siblings of children.values())
    siblings.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  const numbers = new Map<string, string>();
  const visit = (topic: Topic, number: string) => {
    if (numbers.has(topic.id)) return;
    numbers.set(topic.id, number);
    (children.get(topic.id) || []).forEach((child, index) =>
      visit(child, `${number}.${index + 1}`),
    );
  };
  let part = 0;
  let chapter = 0;
  const roots = children.get(null) || [];
  for (const topic of roots) {
    if (isPart(topic)) {
      numbers.set(topic.id, roman(++part));
      for (const child of children.get(topic.id) || []) visit(child, String(++chapter));
    } else {
      visit(topic, String(++chapter));
    }
  }
  return numbers;
}

export function displayTopicName(topic: Topic, numbers: Map<string, string>): string {
  const number = numbers.get(topic.id);
  const name = topic.name.replace(partPrefix, "").replace(outlinePrefix, "");
  if (!number) return name;
  return isPart(topic) ? `Part ${number} — ${name}` : `${number}. ${name}`;
}

export function displayLessonTitle(title: string, topicId: string, numbers: Map<string, string>): string {
  const number = numbers.get(topicId);
  const cleanTitle = title.replace(outlinePrefix, "");
  return number ? `${number}. ${cleanTitle}` : cleanTitle;
}
