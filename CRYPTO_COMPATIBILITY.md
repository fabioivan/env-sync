# 🔐 Compatibilidade da Criptografia C# ↔ TypeScript

Este documento detalha a implementação da criptografia que garante **100% de compatibilidade** entre o sistema C# original e a implementação TypeScript do Env-Sync.

## 📋 Resumo

A classe `CryptValues` foi convertida **exatamente** do C# para TypeScript, mantendo:
- ✅ **Mesmo algoritmo de criptografia**
- ✅ **Mesmos valores de salt e secret**
- ✅ **Mesmo formato de dados criptografados**
- ✅ **Compatibilidade total na descriptografia**

## 🔧 Implementação Técnica

### Classe C# Original
```csharp
public class CryptValues
{
  private string _salt = "0UgQLJiESKyELbVqsgrLJsFXSIF";
  private string _secret = "parangaricutirimirruaro";
  
  public string Encrypt(string input)
  {
    return Base64Util.Encode($"{Base64Util.Encode(MD5Util.Create(_salt))}:{Base64Util.Encode(Base64Util.Encode(input))}:{Base64Util.Encode(MD5Util.Create(_secret))}");
  }
}
```

### Implementação TypeScript Equivalente
```typescript
class CryptValues {
  private _salt = "0UgQLJiESKyELbVqsgrLJsFXSIF";
  private _secret = "parangaricutirimirruaro";
  
  encrypt(input: string): string {
    const saltHash = Base64Util.encode(MD5Util.create(this._salt));
    const encodedInput = Base64Util.encode(Base64Util.encode(input));
    const secretHash = Base64Util.encode(MD5Util.create(this._secret));
    
    const combined = `${saltHash}:${encodedInput}:${secretHash}`;
    return Base64Util.encode(combined);
  }
}
```

## 🎯 Algoritmo de Criptografia

### Formato do Dado Criptografado
```
Base64(Base64(MD5(salt)) + ":" + Base64(Base64(input)) + ":" + Base64(MD5(secret)))
```

### Processo Passo-a-Passo

#### Criptografia:
1. **Hash do Salt**: `MD5("0UgQLJiESKyELbVqsgrLJsFXSIF")` → Encode Base64
2. **Input Duplo**: `Base64(Base64(input))`
3. **Hash do Secret**: `MD5("parangaricutirimirruaro")` → Encode Base64
4. **Combinar**: `saltHash:inputDuplo:secretHash`
5. **Codificar Final**: `Base64(resultado_combinado)`

#### Descriptografia:
1. **Decodificar**: `Base64.decode(input)`
2. **Separar**: Split por `:`
3. **Validar**: Verificar se tem 3 partes
4. **Extrair Dados**: 
   - `saltHash = Base64.decode(parte[0])`
   - `input = Base64.decode(Base64.decode(parte[1]))`
   - `secretHash = Base64.decode(parte[2])`
5. **Validar Hashes**: Verificar MD5 do salt e secret
6. **Retornar**: Input original se válido, `null` se inválido

## 🧪 Teste de Compatibilidade

### Dados de Teste
```json
{
  "SynHost": "dev01-erp.voalle.com.br",
  "SynDb": "hemp_cliente_teste"
}
```

### Resultado Criptografado
```
TWpNMU9EYzVaakk1T0dSaU1USmxaalprWldFd00ySTFZV1JsTTJRMFptUT06WlhsS1ZHVlhOVVZaYVVrMlNXMW9iR0pZUW1aWk1uaHdXbGMxTUZwV09UQmFXRTR3V2xOSmMwbHNUalZpYTJoMll6TlJhVTlwU210YVdGbDNUVk14YkdOdVFYVmtiVGxvWWtkNGJFeHRUblppVXpWcFkybEtPUT09OlpUaGtNak0xWWprMFl6bGlORE5tWkRnM01EbGtNalkyWXpBeE1HTTNNR1U9
```

### Validação
- ✅ **Criptografia**: Dados convertidos corretamente
- ✅ **Descriptografia**: Dados recuperados íntegros
- ✅ **Validação**: Hashes de salt/secret conferem
- ✅ **Erro Handling**: Dados inválidos retornam `null`

## 🔐 Classes Utilitárias

### MD5Util (TypeScript)
```typescript
class MD5Util {
  static create(input: string): string {
    return crypto.createHash("md5").update(input, "utf8").digest("hex");
  }
}
```

### Base64Util (TypeScript)
```typescript
class Base64Util {
  static encode(input: string): string {
    return Buffer.from(input, "utf8").toString("base64");
  }
  
  static decode(input: string): string {
    return Buffer.from(input, "base64").toString("utf8");
  }
}
```

## 🎯 Uso no SynData

### Classe SynData
```typescript
export class SynData {
  constructor(private synHost: string, private synDb: string) {}
  
  encrypt(): string {
    const crypt = new CryptValues();
    const dataObject = { SynDb: this.synDb, SynHost: this.synHost };
    const jsonString = JSON.stringify(dataObject);
    return crypt.encrypt(jsonString);
  }
  
  static decrypt(encryptedSynData: string): { SynDb: string; SynHost: string } | null {
    const crypt = new CryptValues();
    const decryptedJson = crypt.decrypt(encryptedSynData);
    
    if (!decryptedJson) return null;
    
    try {
      return JSON.parse(decryptedJson);
    } catch {
      return null;
    }
  }
}
```

## 🚀 Integração com React

### Arquivo .env.development
```bash
REACT_APP_SYNDATA=TWpNMU9EYzVaakk1T0dSaU1USmxaalprWldFd00ySTFZV1JsTTJRMFptUT06WlhsS1ZHVlhOVVZaYVVrMlNXMW9iR0pZUW1aWk1uaHdXbGMxTUZwV09UQmFXRTR3V2xOSmMwbHNUalZpYTJoMll6TlJhVTlwU210YVdGbDNUVk14YkdOdVFYVmtiVGxvWWtkNGJFeHRUblppVXpWcFkybEtPUT09OlpUaGtNak0xWWprMFl6bGlORE5tWkRnM01EbGtNalkyWXpBeE1HTTNNR1U9
```

### Uso no React (C#)
```javascript
// O sistema C# pode descriptografar este mesmo valor
const synData = process.env.REACT_APP_SYNDATA;
// Usar com sistema C# existente
```

## ✅ Garantias de Compatibilidade

1. **✅ Algoritmo Idêntico**: Mesmo processo de criptografia/descriptografia
2. **✅ Valores Fixos**: Salt e secret exatamente iguais ao C#
3. **✅ Formato Compatível**: Estrutura de dados mantida
4. **✅ Encoding Correto**: Base64 e MD5 implementados igualmente
5. **✅ Tratamento de Erros**: Comportamento idêntico para dados inválidos
6. **✅ Case Insensitive**: Comparação de hashes insensível a maiúsculas/minúsculas

## 🔧 Debugging

Para testar a compatibilidade, use:

```bash
# Instalar e testar
npm install
npm run build
node -e "
const { SynData } = require('./dist/syndata.js');
const syn = new SynData('host.test', 'database_test');
const encrypted = syn.encrypt();
console.log('Encrypted:', encrypted);
const decrypted = SynData.decrypt(encrypted);
console.log('Decrypted:', decrypted);
"
```

## 📝 Notas Importantes

- **Salt**: `"0UgQLJiESKyELbVqsgrLJsFXSIF"` (fixo, do sistema C#)
- **Secret**: `"parangaricutirimirruaro"` (fixo, do sistema C#)
- **Encoding**: UTF-8 para todas as operações de string
- **Hash**: MD5 em hexadecimal lowercase
- **Base64**: Encoding padrão sem quebras de linha

## 🎉 Resultado Final

A implementação TypeScript gera **exatamente o mesmo resultado** que o sistema C# original, garantindo:

- ✅ **Interoperabilidade Total**
- ✅ **Migração Transparente**
- ✅ **Compatibilidade Futura**
- ✅ **Integração Seamless com Sistemas Existentes**

---

*Esta documentação garante que qualquer desenvolvedor pode entender e manter a compatibilidade da criptografia entre os sistemas C# e TypeScript.*
