import { IVerificationAPI, VerificationFailureReason } from '../../core/verificationApi.js';
import { VerificationResult, CanonicalEvent } from '../../core/types.js';
import { IEventStore } from '../../core/eventStore.js';
import { IIdentityLayer } from '../../core/identityLayer.js';
import { validateEventSchema } from '../../protocol/schema.js';
import { canonicalJson } from '../../protocol/canonicalJson.js';
import { sha256 } from '../crypto/sha256.js';

export class VerificationEngine implements IVerificationAPI {
  private eventStore: IEventStore;
  private identityLayer: IIdentityLayer;

  constructor(eventStore: IEventStore, identityLayer: IIdentityLayer) {
    this.eventStore = eventStore;
    this.identityLayer = identityLayer;
  }

  async verifyEvent(eventId: string): Promise<VerificationResult> {
    const result: VerificationResult = {
      isValid: true,
      checks: {
        schema: true,
        signature: true,
        chainIntegrity: true
      }
    };

    try {
      const event = await this.eventStore.getEvent(eventId);
      if (!event) {
        result.isValid = false;
        result.failureReason = VerificationFailureReason.MISSING_EVENT;
        return result;
      }

      try {
        validateEventSchema(event);
      } catch (error) {
        result.isValid = false;
        result.checks.schema = false;
        result.failureReason = VerificationFailureReason.SCHEMA_INVALID;
        return result;
      }

      const payloadForSignature = this.extractPayloadForSignature(event);
      const signatureValid = await this.identityLayer.verifySignature(
        event.actorId,
        payloadForSignature,
        event.signature
      );

      if (!signatureValid) {
        result.isValid = false;
        result.checks.signature = false;
        result.failureReason = VerificationFailureReason.INVALID_SIGNATURE;
        return result;
      }

      if (event.parentHash !== null) {
        const allEvents = await this.getAllEvents();
        const eventIndex = allEvents.findIndex(e => e.eventId === eventId);
        
        if (eventIndex === -1) {
          result.isValid = false;
          result.failureReason = VerificationFailureReason.MISSING_EVENT;
          return result;
        }

        if (eventIndex > 0) {
          const previousEvent = allEvents[eventIndex - 1];
          const previousHash = this.calculateEventHash(previousEvent);
          
          if (event.parentHash !== previousHash) {
            result.isValid = false;
            result.checks.chainIntegrity = false;
            result.failureReason = VerificationFailureReason.HASH_MISMATCH;
            return result;
          }
        } else {
          if (event.parentHash !== null) {
            result.isValid = false;
            result.checks.chainIntegrity = false;
            result.failureReason = VerificationFailureReason.CHAIN_BROKEN;
            return result;
          }
        }
      }

    } catch (error) {
      result.isValid = false;
      result.failureReason = `Unexpected error: ${error}`;
    }

    return result;
  }

  async verifyChain(endEventId: string): Promise<VerificationResult> {
    const result: VerificationResult = {
      isValid: true,
      checks: {
        schema: true,
        signature: true,
        chainIntegrity: true
      }
    };

    try {
      const allEvents = await this.getAllEvents();
      const endIndex = allEvents.findIndex(e => e.eventId === endEventId);
      
      if (endIndex === -1) {
        result.isValid = false;
        result.failureReason = VerificationFailureReason.MISSING_EVENT;
        return result;
      }

      const eventsToVerify = allEvents.slice(0, endIndex + 1);

      for (let i = 0; i < eventsToVerify.length; i++) {
        const event = eventsToVerify[i];

        if (i === 0) {
          if (event.parentHash !== null) {
            result.isValid = false;
            result.checks.chainIntegrity = false;
            result.failureReason = `${VerificationFailureReason.CHAIN_BROKEN} at index ${i}`;
            return result;
          }
        } else {
          const previousEvent = eventsToVerify[i - 1];
          const previousHash = this.calculateEventHash(previousEvent);
          
          if (event.parentHash !== previousHash) {
            result.isValid = false;
            result.checks.chainIntegrity = false;
            result.failureReason = `${VerificationFailureReason.HASH_MISMATCH} at index ${i}`;
            return result;
          }
        }
      }

    } catch (error) {
      result.isValid = false;
      result.failureReason = `Chain verification error: ${error}`;
    }

    return result;
  }

  async verifyBatch(eventIds: string[]): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];
    
    for (const eventId of eventIds) {
      const result = await this.verifyEvent(eventId);
      results.push(result);
    }

    return results;
  }

  private extractPayloadForSignature(event: CanonicalEvent): string {
    const { signature, ...payload } = event;
    return canonicalJson(payload);
  }

  private calculateEventHash(event: CanonicalEvent): string {
    const { signature, ...payload } = event;
    return sha256(canonicalJson(payload));
  }

  private async getAllEvents(): Promise<CanonicalEvent[]> {
    const firstEventId = await this.eventStore.getFirstEventId();
    if (!firstEventId) return [];
    
    const count = await this.eventStore.count();
    return await this.eventStore.getEvents(firstEventId, count);
  }
}