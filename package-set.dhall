let upstream = https://github.com/dfinity/vessel-package-set/releases/download/mo-0.12.0-20240726/package-set.dhall
let Package =
    { name : Text, version : Text, repo : Text, dependencies : List Text }

let
  -- This is where you can add your own packages to the package-set
  additions =
    [
      { 
    name = "hashmap",
    repo = "https://github.com/ZhenyaUsenko/motoko-hash-map",
    version = "master", 
    dependencies = [] : List Text
  },
    ] : List Package

let
  {- This is where you can override existing packages in the package-set

     For example, if you wanted to use version `v2.0.0` of the foo library:
     let overrides = [
         { name = "foo"
         , version = "v2.0.0"
         , repo = "https://github.com/bar/foo"
         , dependencies = [] : List Text
         }
     ]
  -}
  overrides =
    [] : List Package

in  upstream # additions # overrides
