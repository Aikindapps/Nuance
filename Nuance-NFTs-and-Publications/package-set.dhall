let upstream = https://github.com/dfinity/vessel-package-set/releases/download/mo-0.12.0-20240726/package-set.dhall

let Package =
    { name : Text, version : Text, repo : Text, dependencies : List Text }

let
  additions =
      [  { name = "cap"
  , repo = "https://github.com/stephenandrews/cap-motoko-library"
  , version = "v1.0.4-alt"
  , dependencies = [] : List Text
  },
      
  { name = "encoding"
  , repo = "https://github.com/aviate-labs/encoding.mo"
  , version = "v0.3.1"
  , dependencies = [ "array", "base" ]
  },
  { name = "array"
  , repo = "https://github.com/aviate-labs/array.mo"
  , version = "v0.1.1"
  , dependencies = [ "base" ]
  },
  { 
    name = "hashmap",
    repo = "https://github.com/ZhenyaUsenko/motoko-hash-map",
    version = "master", 
    dependencies = [] : List Text
  }
  ] : List Package

in  upstream # additions