/// A module containing Types used by the DateTime module

module {

  public type OperationLog = {
    operation : Text;
    principal : Text;
    timestamp : Int;
  };
};
