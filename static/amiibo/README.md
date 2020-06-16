# Formatting `regions.txt`

> _NOTE_: USE ` INSTEAD OF ' OR "

## Here is how each of the types should be setup in regions.txt:

### standard types

> this includes:
> - `u8`, `u16`, `u32`
>   - for positive-only numbers
> - `i8`, `i16`, `i32`
>   - for numbers that can be negative

these are just the typical integer-based number formats.

```txt
name: type
start offset
end offset
section
description
```

### ABILITIES

abilities are a built-in special type that just create a drop down
of each spirit ability automatically.
These should be taken care of already, so no need to change
or modify them further.

```txt
name: ABILITY
start offset
end offset
section
description
```

### HEX

a type used when not much is known about a region other than the bounds.
this indicates that you'll need to edit the value in the hex editor.

```txt
name: HEX
start offset
end offset
section
description
```

### ENUM

a type used when you want to only provide known sets of values for one
entry in the form of a drop-down.

**THIS CAN BE SET TO AFFECT INDIVIDUAL BITS TOO**

```txt
name: ENUM
0xHEX b(0-7)
0xHEX b(0-7)
section
{
  entry 1: value 1
  entry 2: value 2
  etc: etc
}
description
```

it should be noted that `value`s can take the form of:
- numbers (`69`, `234234`, `646345`, ...)
- hex (`0x56`, `0x04`, ...)
- binary (`0b00001`, `0b100101`, `0b0101`)

### bits

a type used when you want to affect **bits** *instead* of full bytes.
While as of 6/16/2020 it is currently unused, I have a feeling that will change
once a greater understanding of stuff is reached.

```txt
name: bits
0xHEX b(0-7)
0xHEX b(0-7)
section
description
```

Unlike typical input boxes, this will *always* have the binary display
beside it for ease of understanding.