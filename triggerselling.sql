    CREATE OR REPLACE FUNCTION update_sales() RETURNS TRIGGER AS $set_sales$
    DECLARE
    stock_lama INTEGER;
    sum_harga NUMERIC;
    current_invoice TEXT;
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            SELECT stock INTO stock_lama FROM goods WHERE barcode = NEW.itemcode;
            UPDATE goods SET stock = stock_lama - NEW.quantity WHERE barcode = NEW.itemcode;
            current_invoice := NEW.invoice;
        
        ELSIF (TG_OP = 'UPDATE') THEN
            SELECT stock INTO stock_lama FROM goods WHERE barcode = NEW.itemcode;
            UPDATE goods SET stock = stock_lama + OLD.quantity - NEW.quantity WHERE barcode = NEW.itemcode;
            current_invoice := NEW.invoice;
        
        ELSIF (TG_OP = 'DELETE') THEN
            SELECT stock INTO stock_lama FROM goods WHERE barcode = OLD.itemcode;
            UPDATE goods SET stock = stock_lama + OLD.quantity WHERE barcode = OLD.itemcode;
            current_invoice := OLD.invoice;

        END IF;
        SELECT sum(totalprice) INTO sum_harga FROM saleitems WHERE invoice = current_invoice;
        UPDATE sales SET totalsum = sum_harga WHERE invoice = current_invoice;

        RETURN NULL; -- result is ignored since this is an AFTER trigger
    END;
$set_sales$ LANGUAGE plpgsql;

CREATE TRIGGER set_sales
AFTER INSERT OR UPDATE OR DELETE ON saleitems
    FOR EACH ROW EXECUTE FUNCTION update_sales();

--update total harga
CREATE OR REPLACE FUNCTION update_price_sales() RETURNS TRIGGER AS $set_total_price$
    DECLARE 
    total_price_sale NUMERIC;
    BEGIN
        SELECT sellingprice INTO total_price_sale FROM goods WHERE barcode = NEW.itemcode;
        NEW.sellingprice := total_price_sale;
        NEW.totalprice := NEW.quantity * NEW.sellingprice;
        RETURN NEW;
    END;
$set_total_price$ LANGUAGE plpgsql;
    CREATE TRIGGER set_total_price
BEFORE INSERT OR UPDATE ON saleitems
    FOR EACH ROW EXECUTE FUNCTION update_price_sales();