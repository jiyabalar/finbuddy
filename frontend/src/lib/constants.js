export const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Education', 'Entertainment', 'Shopping', 'Rent', 'Bills', 'Other'];
export const BUDGET_CATEGORIES = [...EXPENSE_CATEGORIES.filter((c) => c !== 'Other'), 'Savings'];
export const PAYMENT_METHODS = ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other'];
export const INCOME_SOURCES = ['Salary', 'Allowance', 'Scholarship', 'Freelancing', 'Part-time Job', 'Gift', 'Other'];

export const CATEGORY_STYLE = {
  Food: { emoji: '🍜', color: '#5B54D6' },
  Transport: { emoji: '🚌', color: '#7EE2B8' },
  Education: { emoji: '📚', color: '#FFC93C' },
  Entertainment: { emoji: '🎬', color: '#FF7A6B' },
  Shopping: { emoji: '🛍️', color: '#C7A6F5' },
  Rent: { emoji: '🏠', color: '#1B1848' },
  Bills: { emoji: '💡', color: '#9AD0F5' },
  Savings: { emoji: '🐷', color: '#DDF247' },
  Other: { emoji: '✨', color: '#A3A3B8' },
  Salary: { emoji: '💼', color: '#7EE2B8' },
  Allowance: { emoji: '🎒', color: '#DDF247' },
  Scholarship: { emoji: '🎓', color: '#FFC93C' },
  Freelancing: { emoji: '💻', color: '#8C86F0' },
  'Part-time Job': { emoji: '🧑‍🏫', color: '#9AD0F5' },
  Gift: { emoji: '🎁', color: '#FF7A6B' },
};
export const styleOf = (c) => CATEGORY_STYLE[c] || CATEGORY_STYLE.Other;
export const AVATARS = ['🦊', '🐼', '🦄', '🐯', '🐙', '🦉', '🐸', '🌟'];
export const CURRENCIES = [['INR', '₹ Indian Rupee'], ['USD', '$ US Dollar'], ['EUR', '€ Euro'], ['GBP', '£ British Pound']];
export const DISCLAIMER = 'FinBuddy provides educational budgeting assistance and is not a substitute for professional financial advice.';
