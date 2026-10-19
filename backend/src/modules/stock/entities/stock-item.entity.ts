import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity({ name: 'stock_items' })
@Index(['organizationId', 'reference'], { unique: true })
@Index(['organizationId', 'name'])
export class StockItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ length: 160 })
  name: string;

  @Column({ length: 64 })
  reference: string;

  @Column({ length: 80 })
  category: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  quantity: number;

  @Column({ name: 'minimum_quantity', type: 'int', unsigned: true, default: 0 })
  minimumQuantity: number;

  @Column({ type: 'varchar', length: 32, default: 'unité' })
  unit: string;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 14, scale: 2, default: 0 })
  unitCost: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 6, nullable: true })
  deletedAt: Date | null;

  @BeforeInsert()
  @BeforeUpdate()
  normalize(): void {
    this.name = this.name.trim();
    this.reference = this.reference.trim().toUpperCase();
    this.category = this.category.trim();
    this.unit = this.unit.trim();
  }
}
