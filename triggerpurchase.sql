CREATE OR REPLACE FUNCTION update_purchase() RETURNS TRIGGER AS $set_purchase$
    DECLARE
    stock_lama INTEGER;
    sum_harga NUMERIC;
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            SELECT stock INTO stock_lama FROM goods WHERE barcode = NEW.barcode;
            UPDATE goods SET stock = stock_lama + NEW.quantity WHERE barcode = NEW.barcode;
            
        ELSIF (TG_OP = 'UPDATE') THEN
            SELECT stock INTO stock_lama FROM goods WHERE barcode = NEW.barcode;
            UPDATE goods SET stock = stock_lama + OLD.qty - NEW.quantity WHERE barcode = NEW.barcode;

        ELSIF (TG_OP = 'DELETE') THEN
            SELECT stock INTO stock_lama FROM goods WHERE barcode = NEW.barcode;
            UPDATE goods SET stock = stock_lama - NEW.quantity WHERE barcode = NEW.barcode;
        
        END IF;
         SELECT sum(totalprice) INTO sum_harga FROM purchaseitems WHERE no_invoice = NEW.no_invoice;
        UPDATE purchase SET totalprice = sum_harga WHERE purchase.no_invoice = NEW.no_invoice;
        RETURN NULL;

    END;
$set_purchase$ LANGUAGE plpgsql;

CREATE TRIGGER set_purchase
AFTER INSERT OR UPDATE OR DELETE ON purchaseitems
    FOR EACH ROW EXECUTE FUNCTION update_purchase();


--update total harga
CREATE OR REPLACE FUNCTION purchaseitems() RETURNS TRIGGER AS $set_purchaseitems$
    DECLARE
    purchaseprice_items NUMERIC;
    BEGIN
        SELECT purchaseprice INTO purchaseprice_items FROM barang WHERE barcode = NEW.barcode;
        NEW.purchaseprice := purchaseprice_items;
        NEW.total_harga := NEW.qty * purchaseprice_items;
        RETURN NEW;
    END;
$set_purchaseitems$ LANGUAGE plpgsql;

CREATE TRIGGER set_purchaseitems
BEFORE INSERT OR UPDATE ON purchaseitems
    FOR EACH ROW EXECUTE FUNCTION purchaseitems();
