# arellan-ai-automation — Automatizaciones Basadas en IA (Fase 3)

Automatizaciones inteligentes para el ecosistema Arellan Hnos. Reduce el trabajo manual repetitivo con IA aplicada a procesos de negocio concretos.

## Estado: Fase 3 (no activo en MVP ni Fase 2)

## Automatizaciones Planificadas

### 1. Clasificación Automática de OTs
Clasificar el tipo de servicio de una OT basándose en la descripción del cliente:

```python
# Modelo: clasificador de texto con embeddings
# Input: descripción del problema del cliente
# Output: categoría de servicio (FRENOS, MOTOR, SUSPENSION, ELECTRICO, etc.)

from openai import OpenAI

client = OpenAI()

def classify_work_order(description: str) -> ServiceCategory:
  response = client.chat.completions.create(
    model="gpt-4o-mini",  # Modelo económico para clasificación simple
    messages=[{
      "role": "system",
      "content": """Eres un asistente de clasificación de servicios automotrices.
      Clasifica la descripción del problema en una de estas categorías:
      FRENOS, MOTOR, SUSPENSION, ELECTRICO, TRANSMISION, CARROCERIA, PREVENTIVO, OTRO.
      Responde SOLO con la categoría, nada más."""
    }, {
      "role": "user",
      "content": description
    }],
    max_tokens=20,
  )
  return response.choices[0].message.content.strip()
```

### 2. Generación de Diagnóstico Sugerido
Asistir al mecánico con un diagnóstico inicial basado en el historial del vehículo:

```python
# Input: historial de servicios del vehículo + descripción actual
# Output: diagnóstico sugerido con probabilidad

def suggest_diagnosis(vehicle_history: list, current_problem: str) -> str:
  history_summary = summarize_vehicle_history(vehicle_history)

  response = client.chat.completions.create(
    model="claude-haiku-4-5-20251001",  # Usando Claude API de Anthropic
    messages=[{
      "role": "system",
      "content": "Eres un mecánico automotriz experto. Basándote en el historial del vehículo y el problema reportado, sugiere los diagnósticos más probables en orden de probabilidad."
    }, {
      "role": "user",
      "content": f"Historial: {history_summary}\n\nProblema actual: {current_problem}"
    }],
  )
  return response.choices[0].message.content
```

### 3. Recordatorios de Mantenimiento Preventivo
Generar automáticamente recomendaciones de mantenimiento para clientes:

```typescript
// Worker que ejecuta semanalmente
@Cron('0 9 * * 1')
async sendMaintenanceReminders() {
  const vehicles = await this.vehicleService.getDueForMaintenance()

  for (const vehicle of vehicles) {
    const reminder = await this.aiService.generateMaintenanceMessage({
      vehicleMake: vehicle.make,
      vehicleModel: vehicle.model,
      lastServiceDate: vehicle.lastServiceDate,
      mileageAtLastService: vehicle.lastMileage,
      estimatedCurrentMileage: this.estimateCurrentMileage(vehicle),
      serviceHistory: vehicle.services,
    })

    await this.notificationsService.sendWhatsApp({
      phone: vehicle.client.phone,
      message: reminder,
    })
  }
}
```

### 4. Asistente de Chat para Clientes (Fase 3+)
Chatbot en `arellan-client-portal` para responder preguntas frecuentes:

```typescript
// Responder preguntas sobre estado del vehículo, tiempos estimados, etc.
// Escalamiento automático a humano cuando no puede resolver
const chatAssistant = new AIAssistant({
  model: 'claude-haiku-4-5-20251001',
  systemPrompt: `Eres el asistente virtual de la Clínica Automotriz Arellan Hnos en Surquillo, Lima.
  Responde en español de forma amable y profesional.
  Solo puedes responder sobre: estado de órdenes de trabajo, tiempos estimados, servicios que ofrecemos, y precios aproximados.
  Para todo lo demás, deriva al teléfono: [número].`,
  knowledgeBase: await this.loadWorkshopKnowledge(),
})
```

## Consideraciones de Costo

| Automatización | Modelo | Costo estimado |
|---------------|--------|----------------|
| Clasificación de OTs | GPT-4o-mini / Claude Haiku | ~$0.001 por OT |
| Diagnóstico sugerido | Claude Haiku | ~$0.01 por consulta |
| Recordatorios | Plantillas + minimal AI | ~$0.001 por cliente |
| Chat asistente | Claude Haiku | ~$0.005 por conversación |

Con ~100 OTs/mes, el costo total de IA es < $5 USD/mes.
