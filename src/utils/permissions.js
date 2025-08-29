export const ROLES = { COOK: 'cook', CHEF: 'chef' };

export const can = (role) => ({
  manageAll:        role === ROLES.CHEF,   // keep this as "true admin" if you use it
  manageCooks:      role === ROLES.CHEF,   // ONLY chefs can promote/demote or edit others' user profiles
  manageEvents:     role === ROLES.COOK || role === ROLES.CHEF,
  manageCategories: role === ROLES.COOK || role === ROLES.CHEF,
  manageAnyItem:    role === ROLES.COOK || role === ROLES.CHEF, // cooks can edit ANY item
  manageOwnItem:    role === ROLES.COOK || role === ROLES.CHEF, // redundant but explicit
});