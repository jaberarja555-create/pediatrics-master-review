# Chapter 4 · Genetics (owner, 12 Nov 2026: levels and clean wording as in the Obstetrics book).
# Card: (old index, section, question, answer, level). Facts are unchanged; the short questions are written as complete sentences.
CARDS = {
'genetics': [
(0, 'Down syndrome', 'What is the commonest mechanism of Down syndrome?', 'Non-disjunction, in 94% of cases.', 1),
(1, 'Down syndrome', 'A child has Down syndrome caused by a translocation. What should be done?', 'Karyotype both parents, because one of them may carry a balanced translocation.', 3),
(2, 'Down syndrome', 'What are the facial features of Down syndrome?', 'Upslanting eyes, epicanthic folds, a flat face and a protruding tongue.', 1),
(3, 'Down syndrome', 'Which hand sign is seen in Down syndrome?', 'A single palmar crease.', 1),
(4, 'Down syndrome', 'Which congenital heart defect is typical of Down syndrome?', 'Atrioventricular septal defect (AVSD); 40–50% of children with Down syndrome have congenital heart disease.', 2),
(5, 'Down syndrome', 'Which gastrointestinal anomalies occur in Down syndrome?', 'Duodenal atresia and Hirschsprung disease.', 2),
(6, 'Down syndrome', 'Which endocrine problem is common in Down syndrome?', 'Hypothyroidism.', 1),
(7, 'Down syndrome', 'Which malignancy is more common in Down syndrome?', 'Leukaemia.', 1),
(8, 'Down syndrome', 'Which spinal problem occurs in Down syndrome?', 'Atlanto-axial instability.', 2),
(9, 'Edwards syndrome', 'What are the hand and foot features of trisomy 18 (Edwards syndrome)?', 'Overlapping fingers and rocker-bottom feet.', 2),
(10, 'Patau syndrome', 'What are the features of trisomy 13 (Patau syndrome)?', 'Cleft lip and palate, polydactyly and microphthalmia.', 2),
(11, 'Turner syndrome', 'What is the karyotype of Turner syndrome?', '45,X.', 1),
(12, 'Turner syndrome', 'What is the newborn sign of Turner syndrome?', 'Lymphoedema of the hands and feet.', 2),
(13, 'Turner syndrome', 'What is the commonest feature of Turner syndrome?', 'Short stature.', 1),
(14, 'Turner syndrome', 'Which heart lesions occur in Turner syndrome?', 'Coarctation of the aorta and a bicuspid aortic valve.', 2),
(15, 'Turner syndrome', 'Which kidney anomaly occurs in Turner syndrome?', 'Horseshoe kidney.', 2),
(16, 'Turner syndrome', 'How is Turner syndrome treated?', 'With growth hormone and oestrogen.', 2),
(17, 'Klinefelter syndrome', 'What is the karyotype of Klinefelter syndrome?', '47,XXY.', 1),
(18, 'Klinefelter syndrome', 'What are the features of Klinefelter syndrome?', 'Tall stature, small firm testes, gynaecomastia and infertility.', 2),
(19, 'Inheritance', 'What is the risk to the child of a parent with an autosomal dominant disorder?', '50% for each child.', 1),
(20, 'Inheritance', 'What is the risk in each pregnancy when both parents carry an autosomal recessive disorder?', '25% in each pregnancy.', 1),
(21, 'Inheritance', 'Give examples of X-linked recessive disorders.', 'Haemophilia, Duchenne muscular dystrophy and G6PD deficiency.', 1),
(22, 'Inheritance', 'How is mitochondrial disease inherited?', 'From the mother only.', 2),
(23, 'Syndromes', 'What are the features of fragile X syndrome?', 'A long face, large ears, large testes (macro-orchidism) and intellectual disability.', 2),
(24, 'Syndromes', 'What is the skin sign of neurofibromatosis type 1?', 'Six or more café-au-lait spots.', 2),
(25, 'Syndromes', 'What is the skin sign of tuberous sclerosis?', 'Ash-leaf spots (hypopigmented macules).', 2),
(26, 'Syndromes', 'What are the features of DiGeorge syndrome?', 'Heart defects, absent thymus (thymic aplasia), cleft palate and hypocalcaemia.', 2),
(27, 'Syndromes', 'What are the features of Prader–Willi syndrome?', 'A floppy infant who later develops an excessive appetite (hyperphagia) and obesity.', 2),
(28, 'Prenatal diagnosis', 'Which tests give a prenatal diagnosis, and when are they done?', 'Chorionic villus sampling at 11–14 weeks and amniocentesis from 15 weeks.', 2),
],
}

QS = {
'genetics': {
0: dict(d=1, q='What is the commonest heart defect in Down syndrome?', o=['Ventricular septal defect', 'Atrioventricular septal defect', 'Tetralogy of Fallot', 'Patent ductus arteriosus', 'Atrial septal defect'], e='Atrioventricular septal defect (AVSD) is the typical heart defect of Down syndrome.'),
1: dict(d=1, o=['Down syndrome', 'Edwards syndrome', 'Patau syndrome', 'Turner syndrome', 'Noonan syndrome'], e='Overlapping fingers and rocker-bottom feet are features of trisomy 18 (Edwards syndrome).'),
2: dict(d=1, q='A tall boy with small testes and gynaecomastia has:', o=['Turner syndrome', 'Fragile X syndrome', 'Klinefelter syndrome', 'Marfan syndrome', 'Noonan syndrome'], e='Klinefelter syndrome (47,XXY): tall stature, small firm testes, gynaecomastia and infertility.'),
3: dict(d=1, e='Haemophilia is X-linked recessive, so it affects boys and is carried by their mothers.'),
},
}
