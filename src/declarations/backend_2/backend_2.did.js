export const idlFactory = ({ IDL }) => {
  const Icrc28TrustedOriginsResponse = IDL.Record({
    'trusted_origins' : IDL.Vec(IDL.Text),
  });
  return IDL.Service({
    'hello' : IDL.Func([], [IDL.Text], ['query']),
    'hello_update' : IDL.Func([], [IDL.Text], []),
    'icrc28_trusted_origins' : IDL.Func([], [Icrc28TrustedOriginsResponse], []),
  });
};
export const init = ({ IDL }) => { return []; };
