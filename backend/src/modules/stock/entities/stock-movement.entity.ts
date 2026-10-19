import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { StockItem } from './stock-item.entity';
import { StockMovementKind } from './stock-movement-kind.enum';

@Entity({ name: 'stock_movements' })
@Index(['organizationId', 'createdAt'])
@Index(['itemId', 'createdAt'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'item_id', type: 'char', length: 36 })
  itemId: string;

  @ManyToOne(() => StockItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'item_id' })
  item: StockItem;

  @Column({ type: 'varchar', length: 16 })
  kind: StockMovementKind;

  @Column({ type: 'int' })
  delta: number;

  @Column({ name: 'before_quantity', type: 'int', unsigned: true })
  beforeQuantity: number;

  @Column({ name: 'after_quantity', type: 'int', unsigned: true })
  afterQuantity: number;

  @Column({ name: 'actor_id', type: 'char', length: 36 })
  actorId: string;

  @Column({ name: 'actor_name', type: 'varchar', length: 160 })
  actorName: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  source: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}
