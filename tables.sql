CREATE EXTENSION citext;

CREATE TABLE parts (
    id text PRIMARY KEY,
    description citext,
    mfr text,
    mfr_part citext,
    package text,
    datasheet text,
    images text,
    stock integer
    category integer
);
CREATE INDEX stock ON parts(stock int4_ops);
CREATE INDEX mfr_part ON parts(mfr_part citext_ops);

----------------------------------


CREATE TABLE categories (
    id integer PRIMARY KEY,
    name text,
    parent integer
);