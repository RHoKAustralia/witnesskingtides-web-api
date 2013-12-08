using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WitnessKingTides.Mobile.Web.Models
{
    public class TideTrackerInputModel
    {
        public string Email { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Description { get; set; }

        public string PhotoLocation { get; set; }

        public DateTime? CreationDate { get; set; }

        public HttpPostedFileBase PhotoFile { get; set; }

        public string FlickrId { get; set; }
    }

}