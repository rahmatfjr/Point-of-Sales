    CREATE OR REPLACE FUNCTION update_purchases() RETURNS TRIGGER AS $set_purchases$
    DECLARE
    stock_lama INTEGER;
    sum_harga NUMERIC;
    current_invoice TEXT;
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            SELECT stock INTO stock_lama FROM goods WHERE barcode = NEW.itemcode;
            UPDATE goods SET stock = stock_lama + NEW.quantity WHERE barcode = NEW.itemcode;
            current_invoice := NEW.invoice;
        
        ELSIF (TG_OP = 'UPDATE') THEN
            SELECT stock INTO stock_lama FROM goods WHERE barcode = NEW.itemcode;
            UPDATE goods SET stock = stock_lama - OLD.quantity + NEW.quantity WHERE barcode = NEW.itemcode;
            current_invoice := NEW.invoice;
        
        ELSIF (TG_OP = 'DELETE') THEN
            SELECT stock INTO stock_lama FROM goods WHERE barcode = OLD.itemcode;
            UPDATE goods SET stock = stock_lama - OLD.quantity WHERE barcode = OLD.itemcode;
            current_invoice := OLD.invoice;

        END IF;
        SELECT sum(totalprice) INTO sum_harga FROM purchaseitems WHERE invoice = current_invoice;
        UPDATE purchases SET totalsum = sum_harga WHERE invoice = current_invoice;

        RETURN NULL; -- result is ignored since this is an AFTER trigger
    END;
$set_purchases$ LANGUAGE plpgsql;

CREATE TRIGGER set_purchases
AFTER INSERT OR UPDATE OR DELETE ON purchaseitems
    FOR EACH ROW EXECUTE FUNCTION update_purchases();


--update total harga
CREATE OR REPLACE FUNCTION update_price() RETURNS TRIGGER AS $set_total_price$
    DECLARE 
    total_price_purchase NUMERIC;
    BEGIN
        SELECT purchaseprice INTO total_price_purchase FROM goods WHERE barcode = NEW.itemcode;
        NEW.purchaseprice := total_price_purchase;
        NEW.totalprice := NEW.quantity * NEW.purchaseprice;
        RETURN NEW;
    END;
$set_total_price$ LANGUAGE plpgsql;

CREATE TRIGGER set_total_price
BEFORE INSERT OR UPDATE ON purchaseitems
    FOR EACH ROW EXECUTE FUNCTION update_price();