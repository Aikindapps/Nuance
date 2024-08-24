const PostRelationsIDL = ({ IDL }) => {
  const IndexPostModel = IDL.Record({
    title: IDL.Text,
    content: IDL.Text,
    tags: IDL.Vec(IDL.Text),
    subtitle: IDL.Text,
    postId: IDL.Text,
  });
  const SearchByTagsResponse = IDL.Record({
    postIds: IDL.Vec(IDL.Text),
    totalCount: IDL.Text,
  });
  const Result = IDL.Variant({ ok: IDL.Nat, err: IDL.Text });
  return IDL.Service({
    acceptCycles: IDL.Func([], [], []),
    availableCycles: IDL.Func([], [IDL.Nat], ['query']),
    debug_print_everything: IDL.Func([], [], ['query']),
    getCanisterVersion: IDL.Func([], [IDL.Text], ['query']),
    getMaxMemorySize: IDL.Func([], [IDL.Nat], ['query']),
    getMemorySize: IDL.Func([], [IDL.Nat], ['query']),
    getRelatedPosts: IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
    indexPost: IDL.Func([IndexPostModel], [], []),
    indexPosts: IDL.Func([IDL.Vec(IndexPostModel)], [], []),
    isThereEnoughMemory: IDL.Func([], [IDL.Bool], ['query']),
    removePost: IDL.Func([IDL.Text], [], []),
    searchByTag: IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
    searchByTagWithinPublication: IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Vec(IDL.Text)],
      ['composite_query']
    ),
    searchByTags: IDL.Func(
      [IDL.Vec(IDL.Text), IDL.Nat32, IDL.Nat32],
      [SearchByTagsResponse],
      ['query']
    ),
    searchPost: IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
    searchPublicationPosts: IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Vec(IDL.Text)],
      ['composite_query']
    ),
    setMaxMemorySize: IDL.Func([IDL.Nat], [Result], []),
  });
};

module.exports = {
  PostRelationsIDL,
};
