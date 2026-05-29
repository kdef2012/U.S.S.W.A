export function expandDoubleBrackets(registrations: any[]) {
  const expanded: any[] = [];
  for (const r of registrations) {
    expanded.push(r);
    if (r.double_bracket_division && r.double_bracket_weight_class) {
      expanded.push({
        ...r,
        id: r.id + '_double',
        division: r.double_bracket_division,
        weight_class: r.double_bracket_weight_class,
        fee: 0,
        is_double: true
      });
    }
  }
  return expanded;
}
