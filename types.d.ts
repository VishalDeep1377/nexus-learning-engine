import { Connection } from './node_modules/mongodb/src/cmap/connection';
import { Promise } from './node_modules/mongoose/types/index.d';
import { Connection } from "mongoose";
declare global{ 
    var mongoose:{
        conn:Connection | null
        promise: Promise<Connection> | null
    }
}