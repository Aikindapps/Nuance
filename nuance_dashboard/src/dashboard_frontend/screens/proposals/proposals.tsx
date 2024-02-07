import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar/sidebar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, usePostStore } from '../../store';
import './proposals.scss';
import { IoIosRefresh } from 'react-icons/io';
import { IoIosArrowDown } from 'react-icons/io';

import { CanisterCyclesValue, ProposalSummaryValue } from '../../shared/types';

export const Proposals: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
  }));

  const { getProposals } = usePostStore((state) => ({
    getProposals: state.getProposals,
  }));

  const [isLoading, setIsLoading] = useState(false);

  const [proposals, setProposals] = useState<ProposalSummaryValue[]>([]);

  const loadProposals = async () => {
    setIsLoading(true);
    let proposals = await getProposals();
    if(proposals){
      setProposals(proposals)
    }
    setIsLoading(false);
  };



  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
    loadProposals();
  }, [isLoggedIn]);

  return (
    <div className='page-wrapper'>
      <Sidebar />
      <div className='proposals-wrapper'>
        <div className='proposals-box'>
          <div className='proposals-title-refresh-wrapper'>
            <div className='proposals-title'>Proposals</div>
            <IoIosRefresh
              onClick={async () => {
                await loadProposals();
              }}
              className={
                isLoading ? 'refresh-button spinning' : 'refresh-button'
              }
            />
          </div>
          <div className='proposals-values-wrapper'>
            {proposals.map((proposal) => {
              return (
                <div className='proposals-value-wrapper'>
                  <div className='name'>{proposal.description}</div>
                  <div className={proposal.isRed ? 'value red' : 'value'}>
                    {isLoading ? '-' : proposal.number}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Proposals;
