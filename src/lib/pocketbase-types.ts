/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Authorigins = "_authOrigins",
	Externalauths = "_externalAuths",
	Mfas = "_mfas",
	Otps = "_otps",
	Superusers = "_superusers",
	Boxes = "boxes",
	CardProgress = "card_progress",
	Cards = "cards",
	Courses = "courses",
	StudySessions = "study_sessions",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type IsoAutoDateString = string & { readonly autodate: unique symbol }
export type RecordIdString = string
export type FileNameString = string & { readonly filename: unique symbol }
export type HTMLString = string

type ExpandType<T> = unknown extends T
	? T extends unknown
		? { expand?: unknown }
		: { expand: T }
	: { expand: T }

// System fields
export type BaseSystemFields<T = unknown> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
} & ExpandType<T>

export type AuthSystemFields<T = unknown> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated: IsoAutoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated: IsoAutoDateString
}

export type MfasRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	method: string
	recordRef: string
	updated: IsoAutoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated: IsoAutoDateString
}

export type SuperusersRecord = {
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated: IsoAutoDateString
	verified?: boolean
}

export enum BoxesColorOptions {
	"red" = "red",
	"blue" = "blue",
	"green" = "green",
	"orange" = "orange",
	"purple" = "purple",
	"teal" = "teal",
}

export enum BoxesLearnDirectionOptions {
	"front_to_back" = "front_to_back",
	"back_to_front" = "back_to_front",
	"random" = "random",
}
export type BoxesRecord = {
	archived?: boolean
	color?: BoxesColorOptions
	course?: RecordIdString
	created: IsoAutoDateString
	id: string
	learn_direction?: BoxesLearnDirectionOptions
	name: string
	owner?: RecordIdString
	tts_language?: string
	updated: IsoAutoDateString
}

export type CardProgressRecord = {
	box?: RecordIdString
	card?: RecordIdString
	created: IsoAutoDateString
	id: string
	last_reviewed?: IsoDateString
	level?: number
	next_review?: IsoDateString
	starred?: boolean
	streak?: number
	updated: IsoAutoDateString
	user?: RecordIdString
}

export type CardsRecord = {
	back?: string
	back_image?: FileNameString
	box?: RecordIdString
	created: IsoAutoDateString
	front?: string
	front_image?: FileNameString
	id: string
	sort_order?: number
	updated: IsoAutoDateString
}

export type CoursesRecord = {
	archived?: boolean
	color?: string
	created: IsoAutoDateString
	id: string
	name: string
	updated: IsoAutoDateString
	user?: RecordIdString
}

export type StudySessionsRecord = {
	box?: RecordIdString
	cards_correct?: number
	cards_reviewed?: number
	cards_wrong?: number
	created: IsoAutoDateString
	ended_at?: IsoDateString
	id: string
	started_at?: IsoDateString
	updated: IsoAutoDateString
	user?: RecordIdString
}

export type UsersRecord<Thotkeys = unknown, Tsettings = unknown> = {
	admin?: boolean
	avatar?: FileNameString
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	hotkeys?: null | Thotkeys
	id: string
	name?: string
	password: string
	settings?: null | Tsettings
	tokenKey: string
	updated: IsoAutoDateString
	verified?: boolean
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type BoxesResponse<Texpand = unknown> = Required<BoxesRecord> & BaseSystemFields<Texpand>
export type CardProgressResponse<Texpand = unknown> = Required<CardProgressRecord> & BaseSystemFields<Texpand>
export type CardsResponse<Texpand = unknown> = Required<CardsRecord> & BaseSystemFields<Texpand>
export type CoursesResponse<Texpand = unknown> = Required<CoursesRecord> & BaseSystemFields<Texpand>
export type StudySessionsResponse<Texpand = unknown> = Required<StudySessionsRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Thotkeys = unknown, Tsettings = unknown, Texpand = unknown> = Required<UsersRecord<Thotkeys, Tsettings>> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	boxes: BoxesRecord
	card_progress: CardProgressRecord
	cards: CardsRecord
	courses: CoursesRecord
	study_sessions: StudySessionsRecord
	users: UsersRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	boxes: BoxesResponse
	card_progress: CardProgressResponse
	cards: CardsResponse
	courses: CoursesResponse
	study_sessions: StudySessionsResponse
	users: UsersResponse
}

// Utility types for create/update operations

type ProcessCreateAndUpdateFields<T> = Omit<{
	// Omit AutoDate fields
	[K in keyof T as Extract<T[K], IsoAutoDateString> extends never ? K : never]: 
		// Convert FileNameString to File
		T[K] extends infer U ? 
			U extends (FileNameString | FileNameString[]) ? 
				U extends any[] ? File[] : File 
			: U
		: never
}, 'id'>

// Create type for Auth collections
export type CreateAuth<T> = {
	id?: RecordIdString
	email: string
	emailVisibility?: boolean
	password: string
	passwordConfirm: string
	verified?: boolean
} & ProcessCreateAndUpdateFields<T>

// Create type for Base collections
export type CreateBase<T> = {
	id?: RecordIdString
} & ProcessCreateAndUpdateFields<T>

// Update type for Auth collections
export type UpdateAuth<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof AuthSystemFields>
> & {
	email?: string
	emailVisibility?: boolean
	oldPassword?: string
	password?: string
	passwordConfirm?: string
	verified?: boolean
}

// Update type for Base collections
export type UpdateBase<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof BaseSystemFields>
>

// Get the correct create type for any collection
export type Create<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? CreateAuth<CollectionRecords[T]>
		: CreateBase<CollectionRecords[T]>

// Get the correct update type for any collection
export type Update<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? UpdateAuth<CollectionRecords[T]>
		: UpdateBase<CollectionRecords[T]>

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = {
	collection<T extends keyof CollectionResponses>(
		idOrName: T
	): RecordService<CollectionResponses[T]>
} & PocketBase
