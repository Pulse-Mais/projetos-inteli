CREATE OR REPLACE FUNCTION provisionar_senha_aluno()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.senha_hash IS NULL THEN
    NEW.senha_hash := crypt('Nexus@' || NEW.ra::TEXT, gen_salt('bf', 12));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION provisionar_senha_coordenador()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.senha_hash IS NULL THEN
    NEW.senha_hash := crypt('Nexus@' || NEW.rm::TEXT, gen_salt('bf', 12));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION provisionar_senha_gestor()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.senha_hash IS NULL THEN
    NEW.senha_hash := crypt('Nexus@' || NEW.rm::TEXT, gen_salt('bf', 12));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION provisionar_senha_psicologo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.senha_hash IS NULL THEN
    NEW.senha_hash := crypt('Nexus@' || NEW.rm::TEXT, gen_salt('bf', 12));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_provisionar_senha_aluno ON aluno;
CREATE TRIGGER trg_provisionar_senha_aluno
BEFORE INSERT ON aluno FOR EACH ROW EXECUTE FUNCTION provisionar_senha_aluno();

DROP TRIGGER IF EXISTS trg_provisionar_senha_coordenador ON coordenador;
CREATE TRIGGER trg_provisionar_senha_coordenador
BEFORE INSERT ON coordenador FOR EACH ROW EXECUTE FUNCTION provisionar_senha_coordenador();

DROP TRIGGER IF EXISTS trg_provisionar_senha_gestor ON gestor;
CREATE TRIGGER trg_provisionar_senha_gestor
BEFORE INSERT ON gestor FOR EACH ROW EXECUTE FUNCTION provisionar_senha_gestor();

DROP TRIGGER IF EXISTS trg_provisionar_senha_psicologo ON psicologo;
CREATE TRIGGER trg_provisionar_senha_psicologo
BEFORE INSERT ON psicologo FOR EACH ROW EXECUTE FUNCTION provisionar_senha_psicologo();
