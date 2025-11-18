import slugify from 'slugify';

export const createSlug = (name: string) => {
  return slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
};  