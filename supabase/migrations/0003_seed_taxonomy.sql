insert into public.product_types (name, slug) values
('Whole spices','whole-spices'),('Ground spices','ground-spices'),('Herbs','herbs'),
('Spice blends','spice-blends'),('Seasonings','seasonings'),('Chilli','chilli'),
('Salt','salt'),('Pepper','pepper'),('Seeds','seeds')
on conflict (slug) do nothing;

insert into public.cuisines (name, slug) values
('South African','south-african'),('Indian','indian'),('Pakistani','pakistani'),
('Middle Eastern','middle-eastern'),('Moroccan','moroccan'),('Mexican','mexican'),
('Italian','italian'),('Thai','thai'),('Chinese','chinese'),('Japanese','japanese'),
('African','african')
on conflict (slug) do nothing;

insert into public.food_types (name, slug) values
('Chicken','chicken'),('Beef','beef'),('Lamb','lamb'),('Fish','fish'),
('Seafood','seafood'),('Vegetarian','vegetarian'),('Rice','rice'),('Pasta','pasta'),
('Braai','braai'),('Vegetables','vegetables')
on conflict (slug) do nothing;

insert into public.cooking_methods (name, slug) values
('Braai','braai'),('Grill','grill'),('Oven','oven'),('Air fryer','air-fryer'),
('Curry','curry'),('Stew','stew'),('Fry','fry'),('BBQ','bbq'),
('Smoking','smoking'),('Baking','baking')
on conflict (slug) do nothing;

insert into public.flavours (name, slug) values
('Smoky','smoky'),('Sweet','sweet'),('Earthy','earthy'),('Citrusy','citrusy'),
('Herby','herby'),('Garlic','garlic'),('Aromatic','aromatic'),('Spicy','spicy')
on conflict (slug) do nothing;
