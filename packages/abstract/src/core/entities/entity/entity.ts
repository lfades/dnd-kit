import {effects, reactive, type Effect} from '@dnd-kit/state';

import type {DragDropManager} from '../../manager/index.ts';
import type {Data, UniqueIdentifier} from './types.ts';

interface Options {
  /**
   * A boolean indicating whether the entity should automatically be registered with the manager.
   * @defaultValue true
   */
  register?: boolean;
}

export interface Input<T extends Data = Data, U extends Entity<T> = Entity<T>> {
  id: UniqueIdentifier;
  data?: T | null;
  disabled?: boolean;
  options?: Options;
  effects?(): Effect[];
}

function getDefaultEffects(): Effect[] {
  return [];
}

/**
 * The `Entity` class is an abstract representation of a distinct unit in the drag and drop system.
 * It is a base class that other concrete classes like `Draggable` and `Droppable` can extend.
 *
 * @template T - The type of data associated with the entity.
 */
export class Entity<T extends Data = Data> {
  /**
   * Creates a new instance of the `Entity` class.
   *
   * @param input - An object containing the initial properties of the entity.
   * @param manager - The manager that controls the drag and drop operations.
   */
  constructor(
    input: Input<T>,
    public manager: DragDropManager
  ) {
    const {
      effects: getEffects = getDefaultEffects,
      id,
      options,
      data = null,
      disabled = false,
    } = input;

    let previousId = id;

    this.id = id;
    this.data = data;
    this.disabled = disabled;

    queueMicrotask(() => {
      if (options?.register !== false) {
        manager.registry.register(this);
      }

      const cleanupEffects = effects(
        () => {
          // Re-run this effect whenever the `id` changes
          const {id: _} = this;

          if (id === previousId) {
            return;
          }

          manager.registry.register(this);

          return () => manager.registry.unregister(this);
        },
        ...getEffects()
      );

      this.destroy = () => {
        manager.registry.unregister(this);
        cleanupEffects();
      };
    });
  }

  /**
   * The unique identifier of the entity.
   */
  @reactive
  public id: UniqueIdentifier;

  /**
   * The data associated with the entity.
   */
  @reactive
  public data: Data | null;

  /**
   * A boolean indicating whether the entity is disabled.
   */
  @reactive
  public disabled: boolean;

  /**
   * A method that cleans up the entity when it is no longer needed.
   * @returns void
   */
  public destroy(): void {}
}
