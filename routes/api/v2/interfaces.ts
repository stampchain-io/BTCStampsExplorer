// REQUESTS


export interface PaginationQueryParams {
  limit?: number;
  page?: number;
}

// Extend the existing Request type with the specific query parameters
export interface PaginatedRequest extends Request {
  query: PaginationQueryParams;
}





// RESPONSES

//      /stamps

// Define an export interface for the individual stamp data
export interface StampData {
  stamp: number;
  block_index: number;
  cpid: string;
  asset_longname: string | null;
  creator: string;
  divisible: number | boolean;
  keyburn: any; // Use the appropriate type or 'any' if not sure
  locked: number | boolean;
  message_index: number;
  stamp_base64: string;
  stamp_mimetype: string;
  stamp_url: string;
  supply: number;
  block_time: string;
  tx_hash: string;
  tx_index: number;
  src_data: any; // Use the appropriate type or 'any' if not sure
  ident: string;
  stamp_hash: string;
  is_btc_stamp: number | boolean;
  is_reissue: any; // Use the appropriate type or 'any' if not sure
  file_hash: any; // Use the appropriate type or 'any' if not sure
  is_valid_base64: number | boolean;
  creator_name: string;
}


export interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
};


// Define an export interface for the successful response body
export interface PaginatedSuccessResponseBody extends Pagination {
  last_block: number;
  data: StampData[];
}



// Define an export interface for the error response body
export interface ErrorResponseBody {
  error: string;
}

// Define a type that encompasses both possible response body types
export type PaginatedResponseBody = PaginatedSuccessResponseBody | ErrorResponseBody;


//    /stamp/[id]


interface Holder {
  address: string;
  quantity: number;
}

interface Send {
  from: string | null;
  to: string;
  cpid: string;
  tick: any; // Use the appropriate type or 'any' if not sure
  memo: string;
  satoshirate: any; // Use the appropriate type or 'any' if not sure
  quantity: number;
  tx_hash: string;
  tx_index: number;
  block_index: number;
  block_time: string;
}

// Now define the main response body interface

export interface StampResponseBody {
  data: {
    stamp: StampData;
    holders: Holder[];
    sends: Send[];
    total: number;
  };
  last_block: number;
}


export type ResponseBody = StampResponseBody | ErrorResponseBody;
