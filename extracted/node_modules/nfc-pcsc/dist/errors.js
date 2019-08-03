"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GetUIDError = exports.DisconnectError = exports.ConnectError = exports.AuthenticationError = exports.LoadAuthenticationKeyError = exports.WriteError = exports.ReadError = exports.ControlError = exports.TransmitError = exports.OPERATION_FAILED = exports.CARD_NOT_CONNECTED = exports.FAILURE = exports.BaseError = exports.UNKNOWN_ERROR = void 0;
const UNKNOWN_ERROR = 'unknown_error';
exports.UNKNOWN_ERROR = UNKNOWN_ERROR;

class BaseError extends Error {
  constructor(code, message, previousError) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = 'BaseError';

    if (!message && previousError) {
      this.message = previousError.message;
    }

    this.code = code;

    if (previousError) {
      this.previous = previousError;
    }
  }

}

exports.BaseError = BaseError;
const FAILURE = 'failure';
exports.FAILURE = FAILURE;
const CARD_NOT_CONNECTED = 'card_not_connected';
exports.CARD_NOT_CONNECTED = CARD_NOT_CONNECTED;
const OPERATION_FAILED = 'operation_failed';
exports.OPERATION_FAILED = OPERATION_FAILED;

class TransmitError extends BaseError {
  constructor(code, message, previousError) {
    super(code, message, previousError);
    this.name = 'TransmitError';
  }

}

exports.TransmitError = TransmitError;

class ControlError extends BaseError {
  constructor(code, message, previousError) {
    super(code, message, previousError);
    this.name = 'ControlError';
  }

}

exports.ControlError = ControlError;

class ReadError extends BaseError {
  constructor(code, message, previousError) {
    super(code, message, previousError);
    this.name = 'ReadError';
  }

}

exports.ReadError = ReadError;

class WriteError extends BaseError {
  constructor(code, message, previousError) {
    super(code, message, previousError);
    this.name = 'WriteError';
  }

}

exports.WriteError = WriteError;

class LoadAuthenticationKeyError extends BaseError {
  constructor(code, message, previousError) {
    super(code, message, previousError);
    this.name = 'LoadAuthenticationKeyError';
  }

}

exports.LoadAuthenticationKeyError = LoadAuthenticationKeyError;

class AuthenticationError extends BaseError {
  constructor(code, message, previousError) {
    super(code, message, previousError);
    this.name = 'AuthenticationError';
  }

}

exports.AuthenticationError = AuthenticationError;

class ConnectError extends BaseError {
  constructor(code, message, previousError) {
    super(code, message, previousError);
    this.name = 'ConnectError';
  }

}

exports.ConnectError = ConnectError;

class DisconnectError extends BaseError {
  constructor(code, message, previousError) {
    super(code, message, previousError);
    this.name = 'DisconnectError';
  }

}

exports.DisconnectError = DisconnectError;

class GetUIDError extends BaseError {
  constructor(code, message, previousError) {
    super(code, message, previousError);
    this.name = 'GetUIDError';
  }

}

exports.GetUIDError = GetUIDError;