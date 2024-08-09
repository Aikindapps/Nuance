export const idlFactory = ({ IDL }) => {
  const IndexPostModel = IDL.Record({
    'title' : IDL.Text,
    'content' : IDL.Text,
    'tags' : IDL.Vec(IDL.Text),
    'subtitle' : IDL.Text,
    'postId' : IDL.Text,
  });
  const Result = IDL.Variant({
    'ok' : IDL.Vec(IDL.Principal),
    'err' : IDL.Text,
  });
  const SearchByTagsResponse = IDL.Record({
    'postIds' : IDL.Vec(IDL.Text),
    'totalCount' : IDL.Text,
  });
  return IDL.Service({
    'debug_print_everything' : IDL.Func([], [], ['query']),
    'getRelatedPosts' : IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
    'indexPost' : IDL.Func([IndexPostModel], [], []),
    'indexPosts' : IDL.Func([IDL.Vec(IndexPostModel)], [], []),
    'registerCanister' : IDL.Func([IDL.Principal], [Result], []),
    'removePost' : IDL.Func([IDL.Text], [], []),
    'searchByTag' : IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
    'searchByTagWithinPublication' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Vec(IDL.Text)],
        ['composite_query'],
      ),
    'searchByTags' : IDL.Func(
        [IDL.Vec(IDL.Text), IDL.Nat32, IDL.Nat32],
        [SearchByTagsResponse],
        ['query'],
      ),
    'searchPost' : IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
    'searchPublicationPosts' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Vec(IDL.Text)],
        ['composite_query'],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
